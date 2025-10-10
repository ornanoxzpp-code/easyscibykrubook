document.addEventListener('DOMContentLoaded', () => {
    
    // *** CONFIG: Google Form URL และ Field ID สำหรับ ม.1 ***
    
    // URL สำหรับส่งข้อมูล Google Form (ม.1)
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScCrytTrF7nF7MKQKqgb9Km_ZYndeiA7ADPfhwu98yj6ToU9Q/formResponse'; 
    
    const FIELD_ID = {
        name: 'entry.1276399642',    
        nickname: 'entry.1189280944',     
        classRoom: 'entry.695505628',
        amount: 'entry.1968564265', // จำนวนเงิน
        deskId: 'entry.32303737',    
        seatId: 'entry.102799418',     
    };
    // ********************************************
    
    const seats = document.querySelectorAll('.seat'); 
    const modal = document.getElementById('booking-modal');
    const closeButton = document.querySelector('.close-button');
    const bookingForm = document.getElementById('booking-form');
    const transferDetails = document.getElementById('transfer-details');
    const bookingFormArea = document.getElementById('booking-form-area');
    const nextToFormButton = document.getElementById('next-to-form');
    const backToDetailsButton = document.getElementById('back-to-details');
    const currentDeskInfoStep1 = document.getElementById('current-desk-info-step1');
    const currentDeskInfoStep2 = document.getElementById('current-desk-info-step2');
    
    let selectedSeat = null; 
    window.submitted = false; 

    // ฟังก์ชันจัดการเมื่อการส่งข้อมูลสำเร็จ (อัปเดตข้อความแจ้งเตือน)
    window.handleSuccessfulSubmission = function() {
        if (selectedSeat) {
            alert(`🎉 การจองสำเร็จแล้ว`);
            alert(`รบกวนส่งหลักฐานการชำระเงินมาที่ไลน์ส่วนตัวของคุณครู เพื่อยืนยันการจอง`);
            alert(`บุ๊คขอบคุณค่ะ`);
            closeModal();
            console.warn('⚠️ การจองสำเร็จแล้ว อย่าลืมแก้ไขไฟล์ HTML เพื่อบล็อกที่นั่งนี้');
        }
    };

    const closeModal = () => {
        modal.style.display = 'none';
        bookingForm.reset(); 
        selectedSeat = null;
        bookingFormArea.style.display = 'none';
        transferDetails.style.display = 'block';
    };

    seats.forEach(seat => {
        seat.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            if (seat.getAttribute('data-status') === 'booked') {
                alert('ที่นั่งนี้ถูกจองแล้ว! กรุณาเลือกที่นั่งอื่น');
                return; 
            }
            
            try {
                selectedSeat = seat;
                const seatId = selectedSeat.getAttribute('data-seat-id'); 
                const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id'); 

                const deskInfo = `โต๊ะที่ ${deskId} ตำแหน่ง ${seatId}`;
                currentDeskInfoStep1.textContent = deskInfo;
                currentDeskInfoStep2.textContent = deskInfo;
                
                modal.style.display = 'block';

            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการเปิดฟอร์ม:", error);
                alert("ไม่สามารถเปิดฟอร์มจองได้");
            }
        });
    });
    
    nextToFormButton.addEventListener('click', () => {
        transferDetails.style.display = 'none';
        bookingFormArea.style.display = 'block';
    });
    
    backToDetailsButton.addEventListener('click', () => {
        bookingFormArea.style.display = 'none';
        transferDetails.style.display = 'block';
    });

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        if (selectedSeat) {
            const seatId = selectedSeat.getAttribute('data-seat-id');
            const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id');
            
            document.querySelectorAll('#booking-form input[type="hidden"]').forEach(el => el.remove());

            const hiddenDeskId = document.createElement('input');
            hiddenDeskId.type = 'hidden';
            hiddenDeskId.name = FIELD_ID.deskId;
            hiddenDeskId.value = deskId;
            bookingForm.appendChild(hiddenDeskId);
            
            const hiddenSeatId = document.createElement('input');
            hiddenSeatId.type = 'hidden';
            hiddenSeatId.name = FIELD_ID.seatId;
            hiddenSeatId.value = seatId;
            bookingForm.appendChild(hiddenSeatId);

            bookingForm.action = GOOGLE_FORM_URL;
            bookingForm.method = 'POST';
            bookingForm.target = 'hidden_iframe';
            
            window.submitted = true;
            
            setTimeout(() => {
                bookingForm.submit(); 
            }, 50);
        }
    });
});
